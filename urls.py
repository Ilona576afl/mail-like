
from django.urls import path
from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("emails/<str:mailbox>", views.mailbox, name="mailbox"),
    path("emails/<int:email_id>", views.email_detail, name="email_detail"),
    path("emails", views.send_email, name="send_email"),
    path("emails/<int:email_id>/update", views.update_email, name="update_email"),
]
